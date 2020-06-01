with Orgs as (
        select o.OrganizationId, o.Name 
        from Organization o
                join OrganizationOrganizationType oot on o.OrganizationId = oot.OrganizationId
                join OrganizationType ot on oot.OrganizationTypeId = ot.OrganizationTypeId
        where o.IsActive = 1
                and ot.Name = 'Member'
),
OrgPeeps as (
        select o.OrganizationId, o.Name as OrgName, p.PersonId, p.FirstName + ' ' + p.LastName as PersonName, opct.Name as ContactType
        from Person p
                join OrganizationPerson op on p.PersonId = op.PersonId
                join ContactType opct on op.ContactTypeId = opct.ContactTypeId
                join Orgs o on op.OrganizationId = o.OrganizationId
        where opct.Name IN ('Member Contact','Locate Contact','Field','Damage','IT','GIS')
),
OrgPeepPart2 as(
select  o.OrganizationId,RTRIM(LTRIM(o.Name)) as 'OrgName',c.Code,op.PersonName,op.ContactType
        ,pt.Name as 'PhoneType',p.Number,tem.Name as 'EmailType',em.Address as 'EmailAddress' 
from Orgs o
        left join OrgPeeps op ON o.OrganizationId = op.OrganizationId
        left join PersonPhone pp on op.PersonId = pp.PersonId
        left join PhoneType pt on pp.PhoneTypeId = pt.PhoneTypeId
        left join Phone p on pp.PhoneId = p.PhoneId
        left join PersonEmailAddress pem on op.PersonId = pem.PersonId
        left join EmailAddressType tem on pem.EmailAddressTypeId = tem.EmailAddressTypeId
        left join EmailAddress em on pem.EmailAddressId = em.EmailAddressId
        join OrganizationCode oc on o.OrganizationId = oc.OrganizationId
        join Code c on oc.CodeId = c.CodeId
WHERE (
        pt.Name IN ('Main','Work','Cell','Billing','GIS','Damage','Field','Member')
        AND
        tem.Name IN ('Main','GIS','Work','IT')
        AND
        op.OrgName IS NOT NULL
        and
        o.Name IS NOT NULL
      )
      OR
      (
        op.PersonName IS NULL
        OR
        op.ContactType IS NULL
        OR
        pt.Name IS NULL
        OR
        p.Number IS NULL
        OR
        tem.Name IS NULL
        OR
        em.Address IS NULL
      )
),

orgPeep3 as (
	SELECT o.OrgName
       ,o.Code
       ,ft.Name as 'FacilityType'
       ,o.ContactType
       ,o.PersonName
       ,o.PhoneType
       ,o.Number
       ,o.EmailType
       ,o.EmailAddress
	   ,case when o.ContactType = 'Member Contact'
            then 1
            when o.ContactType = 'Locate Contact'
            then 2
            when o.ContactType = 'Field'
            then 3
            when o.ContactType = 'Damage'
            then 4
            when o.ContactType = 'IT'
            then 5
            when o.ContactType = 'GIS'
            then 6
			else 10 end as contact_order
	FROM OrgPeepPart2 o
      	join OrganizationFacilityType oft on o.OrganizationId = oft.OrganizationId
		join FacilityType ft on oft.FacilityTypeId = ft.FacilityTypeId 
	--ORDER BY o.OrgName,o.Code,ft.Name​
)

select row_number() over(partition by OrgName order by contact_order) as rowNum, contact_order, OrgName, FacilityType, PhoneType, Number, EmailType, EmailAddress,  Code, PersonName, ContactType
from orgPeep3