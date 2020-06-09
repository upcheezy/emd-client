with county_select as (
	select geom
	from county
	where countyname = 'OCONEE' --county dropdown result goes here
), grid_select as (
	select g.id, g.geom
	from grid g, county_select cs
	where st_intersects(g.geom, cs.geom)
), sa_select as (
	select s.dccode, gs.id
	from sa_subdivide s
	join grid_select gs on st_intersects (s.geom, gs.geom)
	group by s.dccode, gs.id
), sa_group as (
	select dccode, array_agg(id order by id) as id_array
	from sa_select
	group by dccode
)
select md.*, id_array
from member_data md
join sa_group s on md.code = s.dccode
where md.contacttype = 'Member Contact';