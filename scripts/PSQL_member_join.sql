-- select dccode, st_union(geom) 
-- from serviceareas 
-- group by dccode;


with gis as (select distinct dccode from serviceareas)
	 select s.dccode, emd.* from gis s 
	 left join emd_member_data emd on s.dccode = emd.code
	 order by s.dccode;
